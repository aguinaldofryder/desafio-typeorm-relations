import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository') private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found!');
    }

    const storedProducts = await this.productsRepository.findAllById(
      products.map(product => ({ id: product.id })),
    );
    const orderProducs = products.map(orderProduc => {
      const product = storedProducts.find(
        findProduct => findProduct.id === orderProduc.id,
      );

      if (!product) {
        throw new AppError('Product not found!');
      }

      return {
        price: product.price,
        product_id: product.id,
        quantity: orderProduc.quantity,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: orderProducs,
    });

    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateOrderService;
